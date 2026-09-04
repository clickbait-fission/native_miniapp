export async function sleep(seconds?: number) {
    if (seconds == null || seconds <= 0) {
        return;
    }
    return new Promise(resolve => setTimeout(resolve, Math.round(seconds * 1000)));
}

export function computeVars() {
    const menuButton = wx.getMenuButtonBoundingClientRect();
    const windowInfo = wx.getWindowInfo();
    return `--safe-top: ${Math.max(menuButton.top, windowInfo.safeArea.top)}px; --safe-bottom: ${windowInfo.windowHeight - windowInfo.safeArea.bottom}px; --menu-button-height: ${menuButton.height}px;`;
}

export function safeBack() {
    if (getCurrentPages().length == 1) {
        wx.redirectTo({
            url: '/pages/index/index',
        });
    } else {
        wx.navigateBack();
    }
}

export function typedNull<T>(): T | null {
    return null;
}
