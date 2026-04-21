from flask import jsonify

def json_error(message: str, status: int):
    return jsonify({"error": message}), status
