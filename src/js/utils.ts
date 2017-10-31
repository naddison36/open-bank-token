
export function convertEthersBNs(object: object): object
{
    const result = {};

    for (let key of Object.keys(object))
    {
        const value: any = object[key];

        if (typeof(value) == 'object' && value != null && value.hasOwnProperty("_bn"))
        {
            result[key] = value._bn;
        }
        else {
            result[key] = value;
        }
    }

    return result;
}