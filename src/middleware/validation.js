const { ZodError } = require("zod");

function validate(schema, target = "body") {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message
          }))
        });
      }

      return next(error);
    }
  };
}

module.exports = validate;
