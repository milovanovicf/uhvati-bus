import { CardContent, CardHeader, CardTitle } from '../ui/card';
import { Edit, Trash } from 'lucide-react';
import { Button } from '../ui/button';

type RouteWithCities = {
  id: number;
  from: { name: string };
  to: { name: string };
  distance?: number | null;
  duration?: number | null;
};

type RoutesTabProps = {
  routes: RouteWithCities[];
  loading: boolean;
  error: string | null;
  refreshRoutes: () => Promise<void>; // optional for actions like delete
};

export default function RoutesTab({
  routes,
  loading,
  error,
  refreshRoutes,
}: RoutesTabProps) {
  function handleEditRoute(id: number): void {
    throw new Error('Function not implemented.');
  }

  function handleDeleteRoute(id: number): void {
    throw new Error('Function not implemented.');
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-xl">Putanje</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Učitavanje...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left">
                  <th className="p-2">ID</th>
                  <th className="p-2">Ruta</th>
                  <th className="p-2">Distance (km)</th>
                  <th className="p-2">Duration (min)</th>
                  <th className="p-2">Kontrole</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{r.id}</td>
                    <td className="p-2">
                      {r.from.name} → {r.to.name}
                    </td>
                    <td className="p-2">{r.distance ?? '-'}</td>
                    <td className="p-2">{r.duration ?? '-'}</td>
                    <td className="p-2 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRoute(r.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRoute(r.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </>
  );
}
