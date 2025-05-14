import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  setCurrentUser,
  setData as setUserData,
} from "../features/usersSlice";

export default function useUser() {
  const dispatch = useDispatch();
  const { data, currentData, loading, error } = useSelector(
    (state) => state.users
  );

  const refetch = () => {
    dispatch(fetchUsers());
  };

  const setCurrentData = (user) => {
    dispatch(setCurrentUser(user));
  };

  const setData = (users) => {
    dispatch(setUserData(users));
  };

  useEffect(() => {
    if (!data.length) {
      refetch();
    }
  }, []);

  return {
    data,
    currentData,
    loading,
    error,
    refetch,
    setCurrentData,
    setData,
  };
}
