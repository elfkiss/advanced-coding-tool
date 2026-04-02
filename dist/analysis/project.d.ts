/**
 * Advanced Coding Tool - 项目分析器
 */
import { ProjectInfo } from '../core/types';
export declare class ProjectAnalyzer {
    private ig;
    constructor();
    analyzeProject(rootPath: string): Promise<ProjectInfo>;
    private loadIgnorePatterns;
    private detectProjectType;
    private getProjectFiles;
    private getDependencies;
    private getProjectConfig;
}
//# sourceMappingURL=project.d.ts.map