import {BadRequestError} from "#exception/errors.js";

export const validate = ({body, params, query} = {}) => (req, res, next) => {
    if (body) {
        const parsed = body.safeParse(req.body);
        if (!parsed.success) return next(new BadRequestError(parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`)))
        req.body = parsed.data;
    }

    if (params) {
        const parsed = params.safeParse(req.params);
        if (!parsed.success) return next(new BadRequestError(parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`)));
        req.params = parsed.data;
    }

    if (query) {
        const parsed = query.safeParse(req.query);
        if (!parsed.success) return next(new BadRequestError(parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`)));
        req.query = parsed.data;
    }

    next();
}

// export function validate(options = {}) {
//     const { body, params, query } = options;
//     const schemas = { body, params, query };
//
//     return function validateMiddleware(req, res, next) {
//         for (const [key, schema] of Object.entries(schemas)) {
//             if (!schema) continue;
//
//             const parsed = schema.safeParse(req[key]);
//             if (!parsed.success) {
//                 return next(new BadRequestError(parsed.error.issues[0].message));
//             }
//             req[key] = parsed.data;
//         }
//
//         next();
//     };
// }