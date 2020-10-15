class TimeoutPromise {
    static create(timeout, executor) {
        if("number" !== typeof timeout) throw "invalid argument: timeout";
        if("function" !== typeof executor) throw "invalid argument: executor";
        return new Promise((resolve, reject) => {
            const timeout_handler = () => {
                executor(resolve, reject);
            };
            window.setTimeout(timeout_handler, timeout);
        });
    }
    static resolve(timeout, value) {
        const executor = (resolve, reject) => resolve(value);
        return TimeoutPromise.create(timeout, executor);
    }
    static reject(timeout, value) {
        const executor = (resolve, reject) => reject(value);
        return TimeoutPromise.create(timeout, executor);
    }
}

const resolve_after = (timeout, value) => TimeoutPromise.resolve(timeout, value);
const reject_after = (timeout, value) => TimeoutPromise.reject(timeout, value);

export { TimeoutPromise, resolve_after, reject_after };
