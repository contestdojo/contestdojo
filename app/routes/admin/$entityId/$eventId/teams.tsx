import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { EventTeam } from "~/utils/db.server";
import db from "~/utils/db.server";

type LoaderData = {
  teams: EventTeam[];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();

  if (!event) throw new Response("Event not found.", { status: 404 });

  const teamsSnap = await db.eventTeams(params.eventId).get();
  const teams = teamsSnap.docs.map((x) => x.data());

  return json<LoaderData>({ teams });
};

export default function IndexRoute() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <div>
      <h4>Teams</h4>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Number</th>
            <th>Name</th>
            <th>Org ID</th>
            <th>Notes</th>
            <th>Score Report</th>
          </tr>
        </thead>
        <tbody>
          {loaderData.teams.map((x) => (
            <tr key={x.id}>
              <td>{x.id}</td>
              <td>{x.number}</td>
              <td>{x.name}</td>
              <td>{x.org.id}</td>
              <td>{x.notes}</td>
              <td>{x.scoreReport}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const handle = {
  navigationHeading: "Teams",
};
