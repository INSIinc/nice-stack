if (!AbortSignal.prototype.throwIfAborted) {
    AbortSignal.prototype.throwIfAborted = function () {
        if (this.aborted) {
            throw new DOMException("The operation was aborted.", "AbortError");
        }
    };
}
