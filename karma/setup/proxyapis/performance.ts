import { createMockPerformanceObject } from "@karma/setup/mocks/performance";

const w: any = window;
let _performance: Performance = null;

export function installPerformanceProxy(): void {
    if (_performance === null) {
        _performance = performance;
        w.performance = createMockPerformanceObject();
    }
}

export function uninstallPerformanceProxy(): void {
    if (_performance !== null) {
        w.performance = _performance;
        _performance = null;
    }
}
