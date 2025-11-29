import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("g/:groupId", "routes/group.tsx"),
    route("g/:groupId/add", "routes/add-expense.tsx"),
] satisfies RouteConfig;
