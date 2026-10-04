import { redirectHouse } from "@/lib/short-links";

export function GET(req: Request) {
  return redirectHouse(req, "mora");
}
