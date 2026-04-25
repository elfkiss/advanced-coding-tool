#!/usr/bin/env python3
"""
Multi-Model Manager - 基于Claude Code的多模型智能路由系统

特性：
- 多模型支持（OpenAI, Anthropic, Google, 本地模型等）
- 智能路由选择
- 性能监控和成本优化
- 模型性能跟踪
- 故障转移机制
"""

import asyncio
import json
import time
import statistics
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
import aiohttp
from concurrent.futures import ThreadPoolExecutor

class ModelType(Enum):
    """模型类型"""
    TEXT = "text"
    CODE = "code"
    EMBEDDING = "embedding"
    CHAT = "chat"

class ModelProvider(Enum):
    """模型提供商"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    MINIMAX = "minimax"
    LOCAL = "local"
    OPENROUTER = "openrouter"

@dataclass
class ModelConfig:
    """模型配置"""
    name: str
    provider: ModelProvider
    model_type: ModelType
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    max_tokens: int = 4096
    temperature: float = 0.7
    timeout: int = 60
    cost_per_1k_tokens: float = 0.0
    priority: int = 1  # 优先级，数字越小优先级越高
    
    # 性能配置
    max_concurrent_requests: int = 5
    retry_attempts: int = 3
    retry_delay: float = 1.0
    
    # 特性支持
    supports_streaming: bool = True
    supports_functions: bool = False
    supports_vision: bool = False

@dataclass
class ModelPerformance:
    """模型性能统计"""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    total_tokens: int = 0
    total_cost: float = 0.0
    average_latency: float = 0.0
    last_used: float = 0.0
    last_error: Optional[str] = None
    
    # 滑动窗口统计（最近100次请求）
    latency_window: List[float] = field(default_factory=list)
    success_rate_window: List[bool] = field(default_factory=list)
    
    def record_request(self, success: bool, tokens: int, latency: float, cost: float):
        """记录请求结果"""
        self.total_requests += 1
        self.total_tokens += tokens
        self.total_cost += cost
        
        if success:
            self.successful_requests += 1
            self.average_latency = (self.average_latency * (self.successful_requests - 1) + latency) / self.successful_requests
        else:
            self.failed_requests += 1
            self.last_error = f"Request failed after {latency:.2f}s"
        
        # 更新滑动窗口
        self.latency_window.append(latency)
        if len(self.latency_window) > 100:
            self.latency_window.pop(0)
        
        self.success_rate_window.append(success)
        if len(self.success_rate_window) > 100:
            self.success_rate_window.pop(0)
        
        self.last_used = time.time()
    
    def get_success_rate(self) -> float:
        """获取成功率"""
        if not self.success_rate_window:
            return 1.0
        return sum(1 for success in self.success_rate_window if success) / len(self.success_rate_window)
    
    def get_average_latency(self) -> float:
        """获取平均延迟（最近100次）"""
        if not self.latency_window:
            return 0.0
        return statistics.mean(self.latency_window)

@dataclass
class RequestContext:
    """请求上下文"""
    prompt: str
    model_type: ModelType
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    priority: int = 1
    
    # 高级选项
    require_code: bool = False
    require_long_context: bool = False
    require_low_cost: bool = False
    require_high_speed: bool = False
    require_high_quality: bool = False
    
    # 元数据
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ModelResponse:
    """模型响应"""
    model: str
    content: str
    tokens_used: int
    cost: float
    latency: float
    success: bool
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

class BaseModelClient:
    """基础模型客户端"""
    
    def __init__(self, config: ModelConfig):
        self.config = config
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def generate(self, context: RequestContext) -> ModelResponse:
        """生成响应"""
        raise NotImplementedError
    
    def get_token_count(self, text: str) -> int:
        """获取token数量"""
        # 简化计算，实际应该使用tiktoken等库
        return len(text) // 4

class OpenAIClient(BaseModelClient):
    """OpenAI 客户端"""
    
    async def generate(self, context: RequestContext) -> ModelResponse:
        start_time = time.time()
        
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            headers = {
                "Authorization": f"Bearer {self.config.api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": self.config.name,
                "messages": [{"role": "user", "content": context.prompt}],
                "max_tokens": context.max_tokens or self.config.max_tokens,
                "temperature": context.temperature or self.config.temperature,
                "stream": self.config.supports_streaming
            }
            
            async with self.session.post(
                f"{self.config.base_url or 'https://api.openai.com/v1'}/chat/completions",
                headers=headers,
                json=data,
                timeout=aiohttp.ClientTimeout(total=self.config.timeout)
            ) as response:
                
                if response.status == 200:
                    result = await response.json()
                    content = result['choices'][0]['message']['content']
                    tokens_used = result['usage']['total_tokens']
                    
                    latency = time.time() - start_time
                    cost = (tokens_used / 1000) * self.config.cost_per_1k_tokens
                    
                    return ModelResponse(
                        model=self.config.name,
                        content=content,
                        tokens_used=tokens_used,
                        cost=cost,
                        latency=latency,
                        success=True,
                        metadata={"provider": "openai", "status_code": response.status}
                    )
                else:
                    error_text = await response.text()
                    latency = time.time() - start_time
                    
                    return ModelResponse(
                        model=self.config.name,
                        content="",
                        tokens_used=0,
                        cost=0.0,
                        latency=latency,
                        success=False,
                        error=f"HTTP {response.status}: {error_text}",
                        metadata={"provider": "openai", "status_code": response.status}
                    )
        
        except Exception as e:
            latency = time.time() - start_time
            return ModelResponse(
                model=self.config.name,
                content="",
                tokens_used=0,
                cost=0.0,
                latency=latency,
                success=False,
                error=str(e),
                metadata={"provider": "openai"}
            )

class AnthropicClient(BaseModelClient):
    """Anthropic 客户端"""
    
    async def generate(self, context: RequestContext) -> ModelResponse:
        start_time = time.time()
        
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            headers = {
                "x-api-key": self.config.api_key,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
            }
            
            data = {
                "model": self.config.name,
                "max_tokens": context.max_tokens or self.config.max_tokens,
                "temperature": context.temperature or self.config.temperature,
                "messages": [{"role": "user", "content": context.prompt}]
            }
            
            async with self.session.post(
                f"{self.config.base_url or 'https://api.anthropic.com/v1'}/messages",
                headers=headers,
                json=data,
                timeout=aiohttp.ClientTimeout(total=self.config.timeout)
            ) as response:
                
                if response.status == 200:
                    result = await response.json()
                    content = result['content'][0]['text']
                    tokens_used = result['usage']['input_tokens'] + result['usage']['output_tokens']
                    
                    latency = time.time() - start_time
                    cost = (tokens_used / 1000) * self.config.cost_per_1k_tokens
                    
                    return ModelResponse(
                        model=self.config.name,
                        content=content,
                        tokens_used=tokens_used,
                        cost=cost,
                        latency=latency,
                        success=True,
                        metadata={"provider": "anthropic", "status_code": response.status}
                    )
                else:
                    error_text = await response.text()
                    latency = time.time() - start_time
                    
                    return ModelResponse(
                        model=self.config.name,
                        content="",
                        tokens_used=0,
                        cost=0.0,
                        latency=latency,
                        success=False,
                        error=f"HTTP {response.status}: {error_text}",
                        metadata={"provider": "anthropic", "status_code": response.status}
                    )
        
        except Exception as e:
            latency = time.time() - start_time
            return ModelResponse(
                model=self.config.name,
                content="",
                tokens_used=0,
                cost=0.0,
                latency=latency,
                success=False,
                error=str(e),
                metadata={"provider": "anthropic"}
            )

class MultiModelManager:
    """多模型管理器"""
    
    def __init__(self):
        self.models: Dict[str, ModelConfig] = {}
        self.clients: Dict[str, BaseModelClient] = {}
        self.performance: Dict[str, ModelPerformance] = {}
        self.request_queue: asyncio.Queue = asyncio.Queue()
        self.semaphore = asyncio.Semaphore(10)  # 最大并发请求数
        self.executor = ThreadPoolExecutor(max_workers=5)
        
        # 路由策略
        self.routing_strategies = {
            'priority': self._route_by_priority,
            'performance': self._route_by_performance,
            'cost': self._route_by_cost,
            'round_robin': self._route_by_round_robin,
            'random': self._route_by_random
        }
        
        self.current_strategy = 'performance'
        self.round_robin_index = 0
    
    def register_model(self, config: ModelConfig):
        """注册模型"""
        self.models[config.name] = config
        self.performance[config.name] = ModelPerformance()
        
        # 创建对应的客户端
        if config.provider == ModelProvider.OPENAI:
            self.clients[config.name] = OpenAIClient(config)
        elif config.provider == ModelProvider.ANTHROPIC:
            self.clients[config.name] = AnthropicClient(config)
        else:
            # 可以扩展其他提供商
            raise ValueError(f"不支持的模型提供商: {config.provider}")
        
        print(f"已注册模型: {config.name} ({config.provider.value})")
    
    def set_routing_strategy(self, strategy: str):
        """设置路由策略"""
        if strategy in self.routing_strategies:
            self.current_strategy = strategy
            print(f"路由策略已设置为: {strategy}")
        else:
            raise ValueError(f"不支持的路由策略: {strategy}")
    
    def _route_by_priority(self, context: RequestContext) -> List[str]:
        """按优先级路由"""
        candidates = []
        for name, config in self.models.items():
            if config.model_type == context.model_type:
                candidates.append((config.priority, name))
        
        candidates.sort()
        return [name for _, name in candidates]
    
    def _route_by_performance(self, context: RequestContext) -> List[str]:
        """按性能路由"""
        candidates = []
        for name, perf in self.performance.items():
            if self.models[name].model_type == context.model_type:
                success_rate = perf.get_success_rate()
                avg_latency = perf.get_average_latency()
                
                # 计算综合分数（成功率权重0.7，延迟权重0.3）
                score = success_rate * 0.7 + (1.0 / (1.0 + avg_latency)) * 0.3
                candidates.append((score, name))
        
        candidates.sort(reverse=True)
        return [name for _, name in candidates]
    
    def _route_by_cost(self, context: RequestContext) -> List[str]:
        """按成本路由"""
        candidates = []
        for name, config in self.models.items():
            if config.model_type == context.model_type:
                candidates.append((config.cost_per_1k_tokens, name))
        
        candidates.sort()
        return [name for _, name in candidates]
    
    def _route_by_round_robin(self, context: RequestContext) -> List[str]:
        """轮询路由"""
        candidates = []
        for name, config in self.models.items():
            if config.model_type == context.model_type:
                candidates.append(name)
        
        if not candidates:
            return []
        
        # 轮询选择
        selected = candidates[self.round_robin_index % len(candidates)]
        self.round_robin_index += 1
        
        return [selected] + [c for c in candidates if c != selected]
    
    def _route_by_random(self, context: RequestContext) -> List[str]:
        """随机路由"""
        import random
        candidates = []
        for name, config in self.models.items():
            if config.model_type == context.model_type:
                candidates.append(name)
        
        random.shuffle(candidates)
        return candidates
    
    async def generate(self, context: RequestContext) -> ModelResponse:
        """生成响应（智能路由）"""
        async with self.semaphore:
            # 1. 选择模型
            model_names = self.routing_strategies[self.current_strategy](context)
            
            if not model_names:
                return ModelResponse(
                    model="",
                    content="",
                    tokens_used=0,
                    cost=0.0,
                    latency=0.0,
                    success=False,
                    error="没有可用的模型"
                )
            
            # 2. 尝试使用选中的模型
            last_error = None
            
            for model_name in model_names:
                try:
                    config = self.models[model_name]
                    client = self.clients[model_name]
                    perf = self.performance[model_name]
                    
                    # 检查并发限制
                    if config.max_concurrent_requests <= 0:
                        last_error = f"模型 {model_name} 达到并发限制"
                        continue
                    
                    # 执行请求
                    async with client:
                        response = await client.generate(context)
                    
                    # 记录性能
                    perf.record_request(
                        success=response.success,
                        tokens=response.tokens_used,
                        latency=response.latency,
                        cost=response.cost
                    )
                    
                    if response.success:
                        return response
                    else:
                        last_error = response.error
                
                except Exception as e:
                    last_error = str(e)
                    if model_name in self.performance:
                        self.performance[model_name].record_request(
                            success=False,
                            tokens=0,
                            latency=0.0,
                            cost=0.0
                        )
            
            # 所有模型都失败
            return ModelResponse(
                model="",
                content="",
                tokens_used=0,
                cost=0.0,
                latency=0.0,
                success=False,
                error=f"所有模型都失败: {last_error}"
            )
    
    async def generate_with_fallback(self, context: RequestContext, max_attempts: int = 3) -> ModelResponse:
        """生成响应（带重试和降级）"""
        for attempt in range(max_attempts):
            response = await self.generate(context)
            
            if response.success:
                return response
            
            if attempt < max_attempts - 1:
                # 等待一段时间后重试
                retry_delay = 2  ** attempt
                print(f"请求失败，{retry_delay}秒后重试: {response.error}")
                await asyncio.sleep(retry_delay)
        
        return response
    
    def get_model_stats(self) -> Dict[str, Dict[str, Any]]:
        """获取模型统计信息"""
        stats = {}
        
        for name, perf in self.performance.items():
            config = self.models[name]
            stats[name] = {
                'provider': config.provider.value,
                'type': config.model_type.value,
                'total_requests': perf.total_requests,
                'success_rate': perf.get_success_rate(),
                'average_latency': perf.get_average_latency(),
                'total_cost': perf.total_cost,
                'last_used': perf.last_used,
                'priority': config.priority,
                'cost_per_1k_tokens': config.cost_per_1k_tokens
            }
        
        return stats
    
    def print_stats(self):
        """打印统计信息"""
        stats = self.get_model_stats()
        
        print("\n" + "="*80)
        print("模型性能统计")
        print("="*80)
        
        for name, stat in sorted(stats.items(), key=lambda x: x[1]['success_rate'], reverse=True):
            print(f"\n模型: {name}")
            print(f"  提供商: {stat['provider']}")
            print(f"  类型: {stat['type']}")
            print(f"  总请求数: {stat['total_requests']}")
            print(f"  成功率: {stat['success_rate']:.2%}")
            print(f"  平均延迟: {stat['average_latency']:.2f}秒")
            print(f"  总成本: ${stat['total_cost']:.4f}")
            print(f"  优先级: {stat['priority']}")
            print(f"  成本/1k tokens: ${stat['cost_per_1k_tokens']:.4f}")


async def main():
    """主函数"""
    # 创建多模型管理器
    manager = MultiModelManager()
    
    # 注册模型（这里需要真实的API key才能运行）
    # 示例配置：
    """
    manager.register_model(ModelConfig(
        name="gpt-4",
        provider=ModelProvider.OPENAI,
        model_type=ModelType.CHAT,
        api_key="your-openai-api-key",
        base_url="https://api.openai.com/v1",
        max_tokens=4096,
        temperature=0.7,
        cost_per_1k_tokens=0.03,
        priority=1
    ))
    
    manager.register_model(ModelConfig(
        name="claude-3-sonnet",
        provider=ModelProvider.ANTHROPIC,
        model_type=ModelType.CHAT,
        api_key="your-anthropic-api-key",
        base_url="https://api.anthropic.com/v1",
        max_tokens=4096,
        temperature=0.7,
        cost_per_1k_tokens=0.003,
        priority=2
    ))
    """
    
    print("多模型管理器已创建")
    print("请添加真实的API key来测试")
    
    # 示例使用
    """
    context = RequestContext(
        prompt="你好，请介绍一下自己",
        model_type=ModelType.CHAT,
        max_tokens=100,
        temperature=0.7
    )
    
    response = await manager.generate(context)
    print(f"响应: {response.content}")
    """


if __name__ == '__main__':
    asyncio.run(main())