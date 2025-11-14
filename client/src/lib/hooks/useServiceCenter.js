import { useCallback } from "react";
import {
  fetchServiceCenterById,
  fetchServiceCenters,
  setServiceCenter,
  updateServiceCenter,
  createServiceCenter,
  deleteServiceCenter,
  uploadServiceCenters,
  setMode,
  setFilters,
  assignServiceCenterToTicket,
  removeServiceCenterAssignment,
  fetchSuggestedServiceCenters,
  fetchUnassignedTickets,
  fetchServiceCenterStats,
} from "../features/serviceCenters";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../components/ui/toast";
import { createErrorHandler } from "../../utils/errorUtils";

const useServiceCenter = () => {
  const dispatch = useDispatch();
  const {
    serviceCenter,
    serviceCenters,
    suggestedServiceCenters,
    unassignedTickets,
    serviceCenterStats,
    filter,
    loading,
    error,
    mode,
    statusCount,
  } = useSelector((state) => state.servicecenter);
  const { addToast } = useToast();

  const setServiceCenterCallback = useCallback(
    (serviceCenter) => dispatch(setServiceCenter(serviceCenter)),
    [dispatch]
  );

  const getServiceCenterById = useCallback(
    (id) => {
      dispatch(fetchServiceCenterById(id));
    },
    [dispatch]
  );

  const getServiceCenters = useCallback(
    (params) => {
      return dispatch(fetchServiceCenters(params));
    },
    [dispatch]
  );

  const updateServiceCenterCallback = useCallback(
    (servicecenter) => {
      const { id, ...serviceCenterData } = servicecenter;
      
      return dispatch(updateServiceCenter({ id, serviceCenterData }))
        .unwrap() // This unwraps the promise and throws on rejection
        .then((result) => {
          addToast({
            title: "Success!",
            description: `ServiceCenter "${servicecenter.name}" has been updated successfully.`,
            variant: "success",
          });
          return result;
        })
        .catch(createErrorHandler(addToast, "update", "servicecenter"));
    },
    [dispatch, addToast]
  );

  const createServiceCenterCallback = useCallback(
    (servicecenter) => {
      return dispatch(createServiceCenter(servicecenter))
        .unwrap() // This unwraps the promise and throws on rejection
        .then((result) => {
          addToast({
            title: "ServiceCenter Created!",
            description: `Great! Your new servicecenter "${servicecenter.name}" has been created and is ready to use.`,
            variant: "success",
          });
          return result;
        })
        .catch(createErrorHandler(addToast, "create", "servicecenter"));
    },
    [dispatch, addToast]
  );

  const deleteServiceCenterCallback = useCallback(
    (id) => {
      return dispatch(deleteServiceCenter(id))
        .unwrap() // This unwraps the promise and throws on rejection
        .then((result) => {
          addToast({
            title: "ServiceCenter Deleted",
            description:
              "The servicecenter has been permanently removed from your system.",
            variant: "destructive",
          });
          return result;
        })
        .catch(createErrorHandler(addToast, "delete", "servicecenter"));
    },
    [dispatch, addToast]
  );

  const uploadServiceCentersCallback = useCallback(
    (serviceCentersData) => {
      return dispatch(uploadServiceCenters(serviceCentersData))
        .unwrap()
        .then((result) => {
          addToast({
            title: "Service Centers Uploaded!",
            description: `Successfully uploaded ${
              result.successful || 0
            } service centers. ${result.failed || 0} failed, ${
              result.skipped || 0
            } skipped.`,
            variant: "success",
          });
          return result;
        })
        .catch(createErrorHandler(addToast, "upload", "service centers"));
    },
    [dispatch, addToast]
  );

  const setModeCallback = useCallback(
    (modeKey) => dispatch(setMode(modeKey)),
    [dispatch]
  );

  const fetchServiceCentersCallback = useCallback(
    (params) => {
      dispatch(fetchServiceCenters(params));
    },
    [dispatch]
  );

  const onPageChange = useCallback(
    (page) => {
      dispatch(setCurrentPage(page));
      getServiceCenters({ skip: page, take: 10, filter: filter });
    },
    [dispatch, getServiceCenters, filter]
  );
  const setFiltersCallback = useCallback(
    (filters) => {
      dispatch(setFilters(filters));
    },
    [dispatch]
  );

  // Service Center Assignment Functions
  const assignServiceCenter = useCallback(
    (ticketId, centerCode) => {
      return dispatch(assignServiceCenterToTicket({ ticketId, centerCode }))
        .unwrap()
        .then((result) => {
          addToast({
            title: "Service Center Assigned!",
            description: `Service center has been successfully assigned to the ticket.`,
            variant: "success",
          });
          return result;
        })
        .catch(createErrorHandler(addToast, "assign", "service center"));
    },
    [dispatch, addToast]
  );

  const removeAssignment = useCallback(
    (ticketId) => {
      return dispatch(removeServiceCenterAssignment(ticketId))
        .unwrap()
        .then((result) => {
          addToast({
            title: "Assignment Removed",
            description:
              "Service center assignment has been removed from the ticket.",
            variant: "success",
          });
          return result;
        })
        .catch(
          createErrorHandler(addToast, "remove", "service center assignment")
        );
    },
    [dispatch, addToast]
  );

  const getSuggestedServiceCenters = useCallback(
    (state) => {
      return dispatch(fetchSuggestedServiceCenters(state));
    },
    [dispatch]
  );

  const getUnassignedTickets = useCallback(() => {
    return dispatch(fetchUnassignedTickets());
  }, [dispatch]);

  const getServiceCenterStats = useCallback(() => {
    return dispatch(fetchServiceCenterStats());
  }, [dispatch]);

  return {
    mode,
    serviceCenter,
    serviceCenters,
    filter,
    fetchServiceCenters: fetchServiceCentersCallback,
    loading,
    error,
    setServiceCenter: setServiceCenterCallback,
    getServiceCenterById,
    getServiceCenters,
    updateServiceCenter: updateServiceCenterCallback,
    createServiceCenter: createServiceCenterCallback,
    deleteServiceCenter: deleteServiceCenterCallback,
    uploadServiceCenters: uploadServiceCentersCallback,
    setMode: setModeCallback,
    onPageChange,
    setFilters: setFiltersCallback,
    // Service Center Assignment Functions
    assignServiceCenter,
    removeAssignment,
    getSuggestedServiceCenters,
    getUnassignedTickets,
    getServiceCenterStats,
    // Direct state access
    suggestedServiceCenters,
    unassignedTickets,
    statusCount,
    serviceCenterStats,
  };
};

export default useServiceCenter;
