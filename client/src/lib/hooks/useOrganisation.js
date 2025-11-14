import { useCallback } from "react";
import {
  fetchOrganisationById,
  fetchOrganisations,
  setOrganisation,
  updateOrganisation,
  createOrganisation,
  deleteOrganisation,
  setMode,
  setFilters,
} from "../features/organisations";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../components/ui/toast";
import { createErrorHandler } from "../../utils/errorUtils";

const useOrganisation = () => {
  const dispatch = useDispatch();
  const { organisation, organisations, filter, loading, error, mode } =
    useSelector((state) => state.organisation);
  const { addToast } = useToast();

  const setOrganisationCallback = useCallback(
    (organisation) => dispatch(setOrganisation(organisation)),
    [dispatch]
  );

  const getOrganisationById = useCallback(
    (id) => {
      dispatch(fetchOrganisationById(id));
    },
    [dispatch]
  );

  const getOrganisations = useCallback(
    (params) => {
      dispatch(fetchOrganisations(params));
    },
    [dispatch]
  );

  const updateOrganisationCallback = useCallback(
    (organisation) => {
      const { id, ...organisationData } = organisation;
      return dispatch(updateOrganisation({ id, organisationData }))
        .unwrap() // This unwraps the promise and throws on rejection
        .then((result) => {
          addToast({
            title: "Success!",
            description: `Organisation "${organisation.name}" has been updated successfully.`,
            variant: "success",
          });
          return result;
        })
        .catch(createErrorHandler(addToast, "update", "organisation"));
    },
    [dispatch, addToast]
  );

  const createOrganisationCallback = useCallback(
    (organisation) => {
      return dispatch(createOrganisation(organisation))
        .unwrap() // This unwraps the promise and throws on rejection
        .then((result) => {
          addToast({
            title: "Organisation Created!",
            description: `Great! Your new organisation "${organisation.name}" has been created and is ready to use.`,
            variant: "success",
          });
          return result;
        })
        .catch(createErrorHandler(addToast, "create", "organisation"));
    },
    [dispatch, addToast]
  );

  const deleteOrganisationCallback = useCallback(
    (id) => {
      return dispatch(deleteOrganisation(id))
        .unwrap() // This unwraps the promise and throws on rejection
        .then((result) => {
          addToast({
            title: "Organisation Deleted",
            description:
              "The organisation has been permanently removed from your system.",
            variant: "destructive",
          });
          return result;
        })
        .catch(createErrorHandler(addToast, "delete", "organisation"));
    },
    [dispatch, addToast]
  );

  const setModeCallback = useCallback(
    (modeKey) => dispatch(setMode(modeKey)),
    [dispatch]
  );

  const fetchOrganisationsCallback = useCallback(
    (params) => {
      dispatch(fetchOrganisations(params));
    },
    [dispatch]
  );

  const onPageChange = useCallback(
    (page) => {
      dispatch(setCurrentPage(page));
      getOrganisations({ skip: page, take: 10, filter: filter });
    },
    [dispatch, getOrganisations, filter]
  );
  const setFiltersCallback = useCallback(
    (filters) => {
      dispatch(setFilters(filters));
    },
    [dispatch]
  );
  return {
    mode,
    organisation,
    organisations,
    filter,
    fetchOrganisations: fetchOrganisationsCallback,
    loading,
    error,
    setOrganisation: setOrganisationCallback,
    getOrganisationById,
    getOrganisations,
    updateOrganisation: updateOrganisationCallback,
    createOrganisation: createOrganisationCallback,
    deleteOrganisation: deleteOrganisationCallback,
    setMode: setModeCallback,
    onPageChange,
    setFilters: setFiltersCallback,
  };
};

export default useOrganisation;
