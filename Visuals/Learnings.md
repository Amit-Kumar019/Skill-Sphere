# Skill_Sphere Project - Key Learnings & Debugging Guide

This document captures the key mistakes, gotchas, and architectural concepts encountered during the development of this backend. Refer to this to avoid similar issues in future projects.

---

## 1. Module Systems: ESM vs. CommonJS
* **The Gotcha**: Mixing ES Module syntax (`import`/`export`) and CommonJS syntax (`require`/`module.exports`) in Node.js will cause runtime crashes like `Cannot use import statement outside a module`.
* **Rules of Thumb**:
  * Check the `package.json` file. If `"type": "module"` is **not** present, Node.js defaults to CommonJS.
  * In **CommonJS**:
    * Import with: `const express = require("express");`
    * Export with: `module.exports = router;` or `module.exports = { functionName };`
  * In **ES Modules (ESM)**:
    * Import with: `import express from "express";`
    * Export with: `export default router;` or `export { functionName };`
  * **Keep it consistent** across the entire project.

---

## 2. Mongoose `select: false` (Hidden Fields)
* **The Gotcha**: Setting `select: false` in a schema field (e.g., `password` or `refreshToken`) excludes it from all query results by default.
  ```javascript
  password: {
      type: String,
      select: false // <-- Hidden by default!
  }
  ```
  If you try to read it later (e.g., `user.password` for password comparison or `user.refreshToken` to verify a token), it will be `undefined`, causing crashes like `Error: Illegal arguments: string, undefined` in bcrypt.
* **The Solution**: Explicitly load the hidden field during your query using `.select("+fieldName")`:
  ```javascript
  const user = await User.findOne({ email }).select("+password");
  ```

---

## 3. Database Schema vs. Controller Fields
* **The Gotcha**: The controller destructured and validated `fullName` from `req.body`, but the database schema required `firstName` and `lastName` (and had no `fullName` field). This caused Mongoose validation to fail, returning `400 Bad Request` or `500 Server Error`.
* **The Solution**: Always align your request payloads and controller validation directly with your Mongoose schema's required fields:
  * Schema has `firstName` and `lastName` $\rightarrow$ Request body must send `firstName` and `lastName`.

---

## 4. Middleware Invocation
* **The Gotcha**: Mounting middleware without calling it as a function:
  * Incorrect: `app.use(cookieParser)`
  * Correct: `app.use(cookieParser())`
* **The Lesson**: Standard middleware packages (like `cookie-parser`, `cors`, `compression`, etc.) are factory functions. They return the actual middleware function, so you must invoke them using parentheses `()`.

---

## 5. Development Watch Mode (Auto-Restart)
* **The Gotcha**: Running the server with raw `node server.js` does not reload when code files change. Any fixes you write will not take effect until you manually kill (`Ctrl+C`) and restart the server.
* **The Solution**: Use a file-watching execution command. You don't even need to install `nodemon` anymore; modern Node.js versions (v18+) support this natively:
  * Run: `node --watch server.js`
  * (I have configured this in your `package.json` as `npm run dev`).

---

## 6. Postman Request Configuration
* **The Gotcha**: Testing endpoints and getting `400 Bad Request` (e.g. "All fields are required") even when you sent the payload.
* **The Solution**: 
  * Ensure the request body is set to **raw** and the format dropdown is set to **JSON**. This automatically adds the `Content-Type: application/json` header. Without this header, `express.json()` will not parse the payload, resulting in an empty `req.body`.
