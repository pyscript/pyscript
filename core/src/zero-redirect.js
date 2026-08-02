/* eslint-disable no-unused-vars */
try {
    crypto.randomUUID();
} catch (_) {
    if (location.href.startsWith("http://0.0.0.0"))
        location.href = location.href.replace("0.0.0.0", "localhost");
}
