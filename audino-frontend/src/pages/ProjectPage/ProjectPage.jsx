import { useEffect, useState } from "react";

import {
  ArrowDownTrayIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import AppBar from "../../components/AppBar/AppBar";
import { useNavigate } from "react-router";
import CardLoader from "../../components/loader/cardLoader";
import AlertModal from "../../components/Alert/AlertModal";
import relativeTime from "dayjs/plugin/relativeTime";
import dayjs from "dayjs";
import { useProjectsStore } from "../../zustand-store/projects";
import useUrlQuery from "../../hooks/useUrlQuery";
import TopBar from "../../components/TopBar/TopBar";
import Pagination from "../../components/Pagination/Pagination";
import { useProjects } from "../../services/Projects/useQueries";
import { useDeleteProjects } from "../../services/Projects/useMutations";

const pageSize = 11;

export default function ProjectPage() {
  const navigate = useNavigate();
  let urlQuery = useUrlQuery();
  dayjs.extend(relativeTime);

  const [deleteModal, setDeleteModal] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  const currentPage = parseInt(urlQuery.get("page"));

  const projects_obj = useProjectsStore((state) => state.projects_obj);
  const setProjects = useProjectsStore((state) => state.setProjects);

  const filters = [
    {
      id: "quick_filter",
      name: "Quick Filter",
      options: [
        {
          label: "Assigned to me",
          value: '{"and":[{"==":[{"var":"assignee"},"<username>"]}]}',
        },
        {
          label: "Owned by me",
          value: '{"and":[{"==":[{"var":"owner"},"<username>"]}]}',
        },
        {
          label: "Not completed",
          value: '{"!":{"and":[{"==":[{"var":"status"},"completed"]}]}}',
        },
      ],
    },
  ]

  const getProjectsQuery = useProjects({
    queryConfig: {
      queryKey: [currentPage, pageSize, appliedFilters, searchValue],
      apiParams: {
        page: currentPage,
        page_size: pageSize,
        searchValue: searchValue,
        ...(appliedFilters.length > 1
          ? {
            filter: JSON.stringify({
              and: appliedFilters.map((filter) => JSON.parse(filter)),
            }),
          }
          : {
            filter: appliedFilters[0],
          }),
      },
      onSuccess: (data) => setProjects(data),
    }
  });

  // const handleDeleteProject = () => {
  //   deleteProjectMutation.mutate({ id: currentProjectId });
  // };

  //  Delete projects
  const deleteProjectMutation = useDeleteProjects({
    mutationConfig: {
      onSuccess: (data, { id }) => {
        setDeleteModal(false);
        setProjects({
          ...projects_obj,
          results: projects_obj.results.filter((res) => res.id !== id),
        });
      },
    },
  });

  const handleDeleteProject = () => {
    deleteProjectMutation.mutate({ id: currentProjectId });
  };


  const filterHandler = (event) => {
    if (event.target.checked) {
      setAppliedFilters([...appliedFilters, event.target.value]);
    } else {
      setAppliedFilters(
        appliedFilters.filter((filterTag) => filterTag !== event.target.value)
      );
    }
  };

  console.log(searchValue);
  return (
    <>
      <AppBar>
        <header className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-white dark:text-gray-100">
              Projects
            </h1>
          </div>
        </header>
      </AppBar>
      <main className=" -mt-32 mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white dark:bg-audino-navy px-5 py-6 shadow sm:px-6 min-h-full">
          <TopBar
            filters={filters}
            onFilter={filterHandler}
            appliedFilters={appliedFilters}
            setSearchValue={setSearchValue}
          />

          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-6">
            {/* new project  */}
            <li
              className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white dark:bg-audino-midnight shadow cursor-pointer py-8 sm:py-0 dark:border dark:border-dashed border-audino-gray"
              onClick={() => navigate("create")}
            >
              <div className="text-center flex justify-center items-center flex-col h-full p-6">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>

                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new project.
                </p>
              </div>
            </li>
            {getProjectsQuery.isLoading || getProjectsQuery.isRefetching
              ? [...Array(5).keys()].map((load) => (
                <li
                  className="col-span-1 divide-y divide-gray-200 dark:divide-audino-gray rounded-lg bg-white dark:bg-audino-midnight  shadow cursor-pointer py-8 sm:py-0"
                  onClick={() => navigate("create")}
                  key={`CardLoader-${load}`}
                >
                  <CardLoader />
                </li>
              ))
              : projects_obj.results.map((project) => (
                <li
                  key={project.id}
                  className="col-span-1 divide-y divide-gray-200 dark:border dark:border-audino-gray dark:divide-audino-gray rounded-lg bg-white  dark:bg-audino-midnight shadow"
                >
                  <div className="flex w-full items-center justify-between space-x-6 p-6">
                    <div className="flex-1 truncate">
                      <div className="flex items-center space-x-3">
                        <h3 className="truncate text-md font-medium text-gray-900 dark:text-white">
                          {project.name}
                        </h3>
                        <span className="inline-flex flex-shrink-0 items-center rounded-full bg-blue-50 dark:bg-audino-green-translucent px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:text-audino-primary  ring-1 ring-inset ring-blue-600/20 dark:ring-audino-primary">
                          {project.status}
                        </span>
                      </div>
                      <p className="mt-2 truncate text-sm text-gray-500 dark:text-white">
                        Created by <span className="dark:text-audino-primary">{project.owner?.username}</span>
                      </p>
                      <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-white">
                        Last updated {dayjs(project.updated_date).fromNow()}
                      </p>
                    </div>
                    {/* <img
                    className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-300"
                    src={project.imageUrl}
                    alt=""
                  /> */}
                  </div>
                  <div className="-mt-px flex divide-x divide-gray-200 dark:divide-audino-gray">
                    {/* <div className="flex w-0 flex-1 items-center justify-center py-4 cursor-pointer  text-gray-400 hover:text-gray-700">
                        <ArrowDownTrayIcon
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                      </div> */}
                    <div
                      className="flex w-0 flex-1 items-center justify-center py-4 cursor-pointer  text-gray-400 dark:text-white hover:text-gray-700 dark:hover:bg-audino-primary dark:hover:text-gray-100"
                      onClick={() => navigate(`${project.id}?page=1`)}
                    >
                      <EyeIcon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div
                      className="flex w-0 flex-1 items-center justify-center py-4 cursor-pointer  text-gray-400 dark:text-white dark:hover:bg-audino-primary hover:text-gray-700 dark:hover:text-gray-100"
                      onClick={() => {
                        setDeleteModal(true);
                        setCurrentProjectId(project.id);
                      }}
                    >
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  </div>
                </li>
              ))}
          </ul>

          {/* pagination */}
          <Pagination
            resultObj={projects_obj}
            pageSize={pageSize}
            currentPage={currentPage}
          />
        </div>

        {/* confirmation modal */}
        <AlertModal
          open={deleteModal}
          setOpen={setDeleteModal}
          onSuccess={handleDeleteProject}
          onCancel={() => setDeleteModal(false)}
          text="Are you sure, you want to delete this project?"
          isLoading={deleteProjectMutation.isLoading}
        />
      </main>
    </>
  );
}
