import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { EventOrganization, Organization } from "~/utils/db.server";
import db from "~/utils/db.server";

type LoaderData = {
  orgs: (Organization & EventOrganization)[];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();

  if (!event) throw new Response("Event not found.", { status: 404 });

  const eventOrgsSnap = await db.eventOrgs(params.eventId).get();
  const eventOrgs = new Map(eventOrgsSnap.docs.map((x) => [x.id, x.data()]));

  const orgsSnap = await db.orgs.get();
  const orgs = orgsSnap.docs.flatMap((x) => {
    const eventOrg = eventOrgs.get(x.id);
    if (!eventOrg) return [];
    return { ...eventOrg, ...x.data() };
  });

  return json<LoaderData>({ orgs });
};

export default function IndexRoute() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <div>
      <h4>Organizations</h4>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Address</th>
            <th>Contact Name</th>
            <th>Contact Email</th>
            <th>Seats Purchased</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {loaderData.orgs.map((x) => (
            <tr key={x.id}>
              <td>{x.id}</td>
              <td>{x.name}</td>
              <td>
                {x.address}, {x.city}, {x.state}, {x.country} {x.zip}
              </td>
              <td>
                {x.adminData.fname} {x.adminData.lname}
              </td>
              <td>{x.adminData.email}</td>
              <td>{x.maxStudents ?? 0}</td>
              <td>{x.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
