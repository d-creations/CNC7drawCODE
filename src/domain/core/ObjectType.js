export function getObjectType(obj) {
    return obj?.type || obj?.constructor?.name || null;
}

export function isObjectType(obj, ...types) {
    const objectType = getObjectType(obj);
    return objectType ? types.includes(objectType) : false;
}