declare module 'echarts-for-react' {
  import type React from 'react';
  import type { CSSProperties } from 'react';
  import type { ECharts, EChartsOption } from 'echarts';
  import type * as echarts from 'echarts';

  export interface ReactEChartsProps {
    option: EChartsOption;
    echarts?: typeof echarts;
    notMerge?: boolean;
    lazyUpdate?: boolean;
    style?: CSSProperties;
    className?: string;
    theme?: string | object;
    onChartReady?: (chart: ECharts) => void;
    onEvents?: Record<string, (...args: unknown[]) => void>;
  }

  const ReactECharts: React.FC<ReactEChartsProps>;
  export default ReactECharts;
}

