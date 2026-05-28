export function ok<T>(data: T, status: number = 200) {
  return Response.json({success: true, data}, {status});
}
export function error(message: string, status: number = 500) {
  return Response.json({success: false, message}, {status});
}