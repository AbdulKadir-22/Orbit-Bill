class ApiResponse {
  constructor(statusCode, message = 'Success', data = null, meta = undefined) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    if (meta !== undefined) {
      this.meta = meta;
    }
  }

  static success(res, message = 'Success', data = null, meta = undefined, statusCode = 200) {
    const responsePayload = {
      success: true,
      message,
      data,
    };
    if (meta !== undefined) {
      responsePayload.meta = meta;
    }
    return res.status(statusCode).json(responsePayload);
  }

  static created(res, message = 'Resource created successfully', data = null) {
    return ApiResponse.success(res, message, data, undefined, 201);
  }
}

module.exports = ApiResponse;
