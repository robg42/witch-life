import { redirect } from "next/navigation";

/*
  /reading used to be the daily reading page; the leaf model has moved
  today's reading onto / itself. Redirect any old bookmarks home.
*/
export default function ReadingRedirect() {
  redirect("/");
}
