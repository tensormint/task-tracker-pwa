const Timer = (() => {
    let startTime = null;
    let elapsedBeforePause = 0;
    let intervalId = null;
    let isRunning = false;

    const formatTime = (totalSeconds) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return [hrs, mins, secs]
            .map((u) => String(u).padStart(2, '0'))
            .join(':');
    };

    const getElapsedSeconds = () => {
        const activeDelta = isRunning ? Date.now() - startTime : 0;
        return Math.floor((elapsedBeforePause + activeDelta) / 1000);
    };

    const start = (onTick) => {
        if (isRunning) return;
        startTime = Date.now();
        isRunning = true;
        intervalId = setInterval(() => {
            if (typeof onTick === 'function') {
                onTick(formatTime(getElapsedSeconds()));
            }
        }, 250);
    };

    const pause = () => {
        if (!isRunning) return;
        elapsedBeforePause += Date.now() - startTime;
        startTime = null;
        isRunning = false;
        clearInterval(intervalId);
        intervalId = null;
    };

    const stop = () => {
        const total = getElapsedSeconds();
        reset();
        return total;
    };

    const reset = () => {
        clearInterval(intervalId);
        intervalId = null;
        startTime = null;
        elapsedBeforePause = 0;
        isRunning = false;
    };

    const getStatus = () => isRunning;

    return {
        start,
        pause,
        stop,
        reset,
        formatTime,
        getElapsedSeconds,
        getStatus
    };
})();