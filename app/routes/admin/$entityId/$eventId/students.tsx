import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { EventStudent } from "~/utils/db.server";
import db from "~/utils/db.server";

type LoaderData = {
  students: EventStudent[];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();

  if (!event) throw new Response("Event not found.", { status: 404 });

  const studentsSnap = await db.eventStudents(params.eventId).get();
  const students = studentsSnap.docs.map((x) => x.data());

  return json<LoaderData>({ students });
};

export default function IndexRoute() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <div>
      <h4>Students</h4>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Number</th>
            <th>Name</th>
            <th>Email</th>
            <th>Grade</th>
            <th>Org ID</th>
            <th>Team ID</th>
            <th>Notes</th>
            <th>Waiver</th>
          </tr>
        </thead>
        <tbody>
          {loaderData.students.map((x) => (
            <tr key={x.id}>
              <td>{x.id}</td>
              <td>{x.number}</td>
              <td>
                {x.fname} {x.lname}
              </td>
              <td>{x.email}</td>
              <td>{x.grade}</td>
              <td>{x.org.id}</td>
              <td>{x.team?.id}</td>
              <td>{x.notes}</td>
              <td>{x.waiver}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const handle = {
  navigationHeading: "Students",
};
