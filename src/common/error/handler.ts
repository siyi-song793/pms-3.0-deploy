export function handleError(err: unknown) {
  console.error('Error:', err)
  alert('操作出错：' + String(err))
}