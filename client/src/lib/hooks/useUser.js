import { useCallback, useEffect } from "react";
import {
  fetchUserById,
  fetchUsers,
  setUser,
  updateUser,
  createUser,
  deleteUser,
  uploadUser,
  setMode,
  setFilters,
} from "../features/users";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../components/ui/toast";
import { extractErrorMessage, createErrorHandler } from "../../utils/errorUtils";

const useUser = () => {
  const dispatch = useDispatch();
  const { user, users, filter, loading, error, mode, statusCounts } =
    useSelector((state) => state.user);
  const { addToast } = useToast();
 
  const setUserCallback = useCallback(
    (user) => dispatch(setUser(user)),
    [dispatch]
  );

  const getUserById = useCallback(
    (id) => {
      dispatch(fetchUserById(id));
    },
    [dispatch]
  );

  const getUsers = useCallback((params) => {
    dispatch(fetchUsers(params));
  }, [dispatch]);

  const updateUserCallback = useCallback(
    (user) => {
      const { id, ...userData } = user;
      return dispatch(updateUser({ id, userData }))
        .unwrap() // This unwraps the promise and throws on rejection
        .then((result) => {
          addToast({
            title: "Success!",
            description: `User "${user.name}" has been updated successfully.`,
            variant: "success",
          });
          return result;
        })
        .catch(createErrorHandler(addToast, "update", "user"));
    },
    [dispatch, addToast]
  );

  const createUserCallback = useCallback(
    (user) => {
      return dispatch(createUser(user))
        .unwrap() // This unwraps the promise and throws on rejection
        .then((result) => {
          addToast({
            title: "User Created!",
            description: `Great! Your new user "${user.name}" has been created and is ready to use.`,
            variant: "success",
          });
          return result;
        })
        .catch(createErrorHandler(addToast, "create", "user"));
    },
    [dispatch, addToast]
  );

  const deleteUserCallback = useCallback(
    (id) => {
      return dispatch(deleteUser(id))
        .unwrap() // This unwraps the promise and throws on rejection
        .then((result) => {
          addToast({
            title: "User Deleted",
            description:
              "The user has been permanently removed from your system.",
            variant: "destructive",
          });
          return result;
        })
        .catch(createErrorHandler(addToast, "delete", "user"));
    },
    [dispatch, addToast]
  );

  const setModeCallback = useCallback(
    (modeKey) => dispatch(setMode(modeKey)),
    [dispatch]
  );

  const fetchUsersCallback = useCallback(
    (params) => {
      dispatch(fetchUsers(params));
    },
    [dispatch]
  );

  const uploadUserCallback = useCallback(
    (userData) => {
      return dispatch(uploadUser(userData))
        .unwrap()
        .then((result) => {
          addToast({
            title: "Users Uploaded!",
            description: `Successfully uploaded ${result.count || 'multiple'} users.`,
            variant: "success",
          });
          return result;
        })
        .catch(createErrorHandler(addToast, "upload", "users"));
    },
    [dispatch, addToast]
  );

  const updateUserStatusCallback = useCallback(
    (id, status) => {
      return dispatch(updateUser({ id, userData: { status } }))
        .unwrap()
        .then((result) => {
          addToast({
            title: "Status Updated!",
            description: `User status has been updated to ${status}.`,
            variant: "success",
          });
          return result;
        })
        .catch(createErrorHandler(addToast, "update status", "user"));
    },
    [dispatch, addToast]
  );

  const onPageChange = useCallback(
    (page) => {
      dispatch(setCurrentPage(page));
      getUsers({ skip: page, take: 10, filter: filter });
    },
    [dispatch, getUsers, filter]
  );

  const setFiltersCallback = useCallback(
    (newFilters) => {
      dispatch(setFilters(newFilters));
    },
    [dispatch]
  );

  return {
    mode,
    user,
    users,
    filter,
    fetchUsers: fetchUsersCallback,
    loading,
    error,
    statusCounts,
    setUser: setUserCallback,
    getUserById,
    getUsers,
    updateUser: updateUserCallback,
    createUser: createUserCallback,
    deleteUser: deleteUserCallback,
    uploadUser: uploadUserCallback,
    updateUserStatus: updateUserStatusCallback,
    setMode: setModeCallback,
    onPageChange,
    setFilters: setFiltersCallback,
  };
};

export default useUser;
