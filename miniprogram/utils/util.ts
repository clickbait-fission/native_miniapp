export async function sleep(seconds?: number) {
    if (seconds == null || seconds <= 0) {
        return;
    }
    return new Promise(resolve => setTimeout(resolve, Math.round(seconds * 1000)));
}