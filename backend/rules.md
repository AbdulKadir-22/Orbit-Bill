# Backend Rules

1. **Modular Architecture:** Organize the backend by feature inside `src/modules/`. Each module must maintain its own models, controllers, routes and validations.

2. **Database:** Use the existing MongoDB connection and Mongoose models. Follow the approved database schema. Do not introduce unnecessary collections or fields.

3. **Validation:** Validate incoming request data using the appropriate validation layer before processing it.

4. **Error Handling:** Use centralized error-handling middleware. Return consistent error responses with appropriate HTTP status codes.

5. **API Responses:** Maintain a consistent JSON response structure across all endpoints.

6. **Separation of Concerns:** Keep controllers focused on HTTP handling. Move reusable business logic into appropriate service functions when necessary.

7. **Security:** Never expose sensitive environment variables, database credentials or internal error details. Validate and sanitize user input.

8. **Database Operations:** Use asynchronous operations with proper error handling. Avoid unnecessary database queries and duplicate operations.

9. **Coding Standards:** Follow existing naming conventions and project architecture. Keep implementations simple and readable.

10. **No Unnecessary Code:** Avoid redundant abstractions, dependencies, comments and unused functions. Do not overengineer simple functionality.

11. **Environment Configuration:** Store configuration and secrets in environment variables. Maintain an updated `.env.example`.

12. **Existing Code:** Inspect existing implementations before modifying them. Preserve working functionality unless changes are required.

13. **API Compatibility:** Maintain consistent endpoint naming, HTTP methods and response structures. Coordinate API contracts with the frontend implementation.

14. **Testing:** Verify every implemented endpoint, including successful responses, validation failures and error scenarios.