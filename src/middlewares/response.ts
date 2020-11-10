import express, { Request, Response } from "express";
interface ResponseMessage {
  sessionId?: string;
  message: string;
  statusCode: number;
  phonenenumber?: number;
}
{
}

export class Message implements ResponseMessage {
  phonenenumber = 0;
  constructor(
    public sessionId: string,
    public statusCode: number,
    public message: string
  ) {}
  sendMessage = (req: Request, res: Response) => {
    return res.send({});
  };
}
