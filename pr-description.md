🔒 Fix unauthenticated access in OPTIONS endpoint

🎯 **What:** The `OPTIONS` handler in `src/pages/api/lead.ts` did not validate if the origin requested was allowed. Instead, it returned a 204 regardless of what origin initiated the CORS preflight request, thus exposing CORS header configuration.

⚠️ **Risk:** While not allowing POST functionality on its own, revealing CORS information to any origin without returning 403 when appropriate could aid attackers in gathering information about our endpoints or executing unwanted actions via CSRF in the worst case scenarios, depending on API consumers or further evolution of this endpoint.

🛡️ **Solution:** Added a check to see if the origin is provided and not part of the `ALLOWED_ORIGINS` Set. If so, a `403 Forbidden` response is returned immediately before returning any 204 or setting valid CORS headers. This aligns the `OPTIONS` preflight security check with the behavior implemented in the `POST` method.
