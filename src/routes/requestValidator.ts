import { Static, TObject, TProperties, Type } from "@sinclair/typebox";
import { RequestHandler } from "express";
import { parseTypeboxdata } from "src/utils/typeBox";

export const validateBody: <TBody extends TProperties>(
  validate: TObject<TBody>
) => RequestHandler<
  unknown,
  any,
  Static<TObject<TBody>, []>,
  unknown,
  Record<string, any>
> = function (validate) {
  return function (req, _res, next) {
    const bodyData = parseTypeboxdata(validate, req.body, true);

    req.body = { ...bodyData };

    return next();
  };
};

export const validateQuery: <TQuery extends TProperties>(
  validate: TObject<TQuery>
) => RequestHandler<
  unknown,
  any,
  unknown,
  Static<TObject<TQuery>, []>,
  Record<string, any>
> = function (validate) {
  return function (req, _res, next) {
    const queryData = parseTypeboxdata(validate, req.query, true);

    req.query = { ...queryData };

    return next();
  };
};
