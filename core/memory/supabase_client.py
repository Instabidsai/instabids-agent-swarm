class SupabaseClient:
    """A minimal async stub for Supabase interactions used for testing."""

    async def get_client(self):
        """Return self as a mock client."""
        return self

    async def insert(self, table: str, data):
        """Pretend to insert data and return a basic response."""
        return {"table": table, "data": data}

    # The following methods allow method chaining used in EventStore.get_events_for_aggregate
    def table(self, _name: str):
        return self

    def select(self, *args, **kwargs):
        return self

    def eq(self, *args, **kwargs):
        return self

    def order(self, *args, **kwargs):
        return self

    async def execute(self):
        class Response:
            def __init__(self):
                self.data = []
        return Response()

