const ObjectId = require("mongoose").Types.ObjectId;
const helper = require("../utils/helper");
const jwt = require("jsonwebtoken");
const User = require("../models/user_model");

///schema is Joi Object Schema
exports.validateBody = (schema) => (req, res, next) => {
  let result = schema.validate(req.body);
  if (result.error) {
    let errMsg = result.error.details[0].message.split('"').join("");
    return next(createError(errMsg, 422));
  }
  next();
};

exports.validateMongoId = (req, res, next) => {
  ///req.params.id, so route params must be "/:id"
  if (!ObjectId.isValid(req.params.id)) {
    return next(createError("invalid request id", 422));
  }
  next();
};

exports.validateQuery = (queryName) => (req, res, next) => {
  if (req.query[queryName] === undefined) {
    return next(createError(`${queryName} is not a valid`, 422));
  }
  next();
};
exports.validateToken = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return next(createError(401, "Token is missing"));
    }

    const token = authorization.split(" ")[1];
    if (!token) {
      return next(createError(401, "Token is missing"));
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded) => {
      if (err) {
        return next(createError(498, "Access token expired or invalid"));
      }

      // Get user from token payload (e.g. decoded.id or decoded.data.id)
      const userId = decoded?.data?._id || decoded?.id;

      if (!userId) {
        return next(createError(401, "Invalid token payload"));
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Attach user to request
      req.user = user;
      next();
    });
  } catch (err) {
    next(createError(500, "Internal server error"));
  }
};

exports.validateOptionalToken = (req, res, next) => {
  let authorization = req.headers.authorization;
  if (!authorization) {
    return next();
  }
  let token = authorization.split(" ")[1];
  if (token) {
    try {
      let user = helper.decodeToken(token);
      if (user) {
        req.user = user;
        return next();
      }
      next();
    } catch (error) {
      next();
    }
  } else {
    next();
  }
};

exports.validateAccessCode = (req, res, next) => {
  let access_code = req.headers["access-code"];
  // console.log(access_code);
  if (!access_code) {
    return next(createError("invalid access code", 498));
  }
  if (access_code != process.env.ACCESS_CODE) {
    return next(createError("wrong access code", 498));
  }
  next();
};

///role must be array ['owner'], for multi role access
///role must be array ['owner','admin']
exports.validateRole = (roles) => (req, res, next) => {
  let authorization = req.headers.authorization;
  if (!authorization) {
    return next(createError("Invalid Token", 401));
  }
  let token = authorization.split(" ")[1];
  let decoded = helper.decodeToken(token);
  req.user = decoded.data;
  if (!roles.includes(req.user.role)) {
    return next(createError("You don't have this permission", 401));
  }
  next();
};

exports.notFoundRoute = (req, res, next) => {
  return next(createError("Route Not Found", 404));
};
exports.errorRoute = (err, req, res, next) => {
  if (res.headersSent) return;
  let errCode = err.status || 500;
  let path = ": Path ";
  if (err.message.includes(path)) {
    err.message = err.message.split(path).pop().replaceAll("`", "");
  }

  let data = {
    status: false,
    message: err.message,
    data: null,
  };

  res.status(errCode).json(data);
};

const createError = (message, status) => {
  const err = new Error(message);
  err.status = status;
  return err;
};