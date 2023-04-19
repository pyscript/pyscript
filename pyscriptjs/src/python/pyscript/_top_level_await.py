import ast


class TopLevelAwaitFinder(ast.NodeVisitor):
    def is_source_top_level_await(self, source):
        self.async_found = False
        node = ast.parse(source)
        self.generic_visit(node)
        return self.async_found

    def visit_Await(self, node):
        self.async_found = True

    def visit_AsyncFor(self, node):
        self.async_found = True

    def visit_AsyncWith(self, node):
        self.async_found = True

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        pass  # Do not visit children of async function defs


def uses_top_level_await(source: str) -> bool:
    return TopLevelAwaitFinder().is_source_top_level_await(source)
