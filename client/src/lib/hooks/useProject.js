import { useCallback } from "react";
import {
  fetchProjectById,
  fetchProjects,
  setProject,
  updateProject,
  createProject,
  deleteProject,
  setMode,
  setFilters,
} from "../features/projects";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../components/ui/toast";
import { createErrorHandler } from "../../utils/errorUtils";

const useProject = () => {
  const dispatch = useDispatch();
  const { project, projects, filter, loading, error, mode } =
    useSelector((state) => state.project);
  const { addToast } = useToast();

  const setProjectCallback = useCallback(
    (project) => dispatch(setProject(project)),
    [dispatch]
  );

  const getProjectById = useCallback(
    (id) => {
      dispatch(fetchProjectById(id));
    },
    [dispatch]
  );

  const getProjects = useCallback(
    (params) => {
      dispatch(fetchProjects(params));
    },
    [dispatch]
  );

  const updateProjectCallback = useCallback(
    (project) => {
      const { id, ...projectData } = project;
      return dispatch(updateProject({ id, projectData }))
        .unwrap() // This unwraps the promise and throws on rejection
        .then((result) => {
          addToast({
            title: "Success!",
            description: `Project "${project.name}" has been updated successfully.`,
            variant: "success",
          });
          return result;
        })
        .catch(createErrorHandler(addToast, "update", "project"));
    },
    [dispatch, addToast]
  );

  const createProjectCallback = useCallback(
    (project) => {
      return dispatch(createProject(project))
        .unwrap() // This unwraps the promise and throws on rejection
        .then((result) => {
          addToast({
            title: "Project Created!",
            description: `Great! Your new project "${project.name}" has been created and is ready to use.`,
            variant: "success",
          });
          return result;
        })
        .catch(createErrorHandler(addToast, "create", "project"));
    },
    [dispatch, addToast]
  );

  const deleteProjectCallback = useCallback(
    (id) => {
      return dispatch(deleteProject(id))
        .unwrap() // This unwraps the promise and throws on rejection
        .then((result) => {
          addToast({
            title: "Project Deleted",
            description:
              "The project has been permanently removed from your system.",
            variant: "destructive",
          });
          return result;
        })
        .catch(createErrorHandler(addToast, "delete", "project"));
    },
    [dispatch, addToast]
  );

  const setModeCallback = useCallback(
    (modeKey) => dispatch(setMode(modeKey)),
    [dispatch]
  );

  const fetchProjectsCallback = useCallback(
    (params) => {
      dispatch(fetchProjects(params));
    },
    [dispatch]
  );

  const onPageChange = useCallback(
    (page) => {
      dispatch(setCurrentPage(page));
      getProjects({ skip: page, take: 10, filter: filter });
    },
    [dispatch, getProjects, filter]
  );
  const setFiltersCallback = useCallback(
    (filters) => {
      dispatch(setFilters(filters));
    },
    [dispatch]
  );
  return {
    mode,
    project,
    projects,
    filter,
    fetchProjects: fetchProjectsCallback,
    loading,
    error,
    setProject: setProjectCallback,
    getProjectById,
    getProjects,
    updateProject: updateProjectCallback,
    createProject: createProjectCallback,
    deleteProject: deleteProjectCallback,
    setMode: setModeCallback,
    onPageChange,
    setFilters: setFiltersCallback,
  };
};

export default useProject;
