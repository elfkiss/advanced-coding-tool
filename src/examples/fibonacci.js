// 斐波那契数列函数\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\n// 测试\nconsole.log(fibonacci(10)); // 55
