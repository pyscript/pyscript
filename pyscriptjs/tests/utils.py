def retry(times, exceptions):
    def decorator(func):
        def newfn(*args, **kwargs):
            attempt = 0
            while attempt < times:
                try:
                    return func(*args, **kwargs)
                except exceptions:
                    print(
                        f"""Exception thrown when attempting to run {func} at
                        attempt {attempt} of {times}, retrying..."""
                    )
                    attempt += 1
            return func(*args, **kwargs)

        return newfn

    return decorator
