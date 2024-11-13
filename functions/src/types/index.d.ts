export type Res<ErrorType = null, DataType = null> = {
    message: string,
    error?: ErrorType,
    data?: DataType
}