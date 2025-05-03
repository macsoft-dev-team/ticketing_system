import { useEffect } from "react";
   import {
    fetchData,
    createData,
    updateData,
    deleteData,
    setCurrentData as setCurrentDataSet,
    setShow,
    setData as setarrayData,
  } from "../features/crudSlice";
import { message } from "antd";
import { useSelector,useDispatch } from "react-redux";
 

export default function useCrud(entity) {
  const dispatch = useDispatch();
  const { data, currentData, show, loading, error } = useSelector(
    (state) => state.crud[entity]
  );

  useEffect(() => {
    dispatch(fetchData({ entity }));
    console.log("Fetching data for entity:", entity);
  }, [dispatch, entity]);

  const refetch = () => {
    dispatch(fetchData({ entity }));
  };

  const createItem = (newData) => {
    try {
      dispatch(createData({ entity, newData }));
      message.success("Item created successfully!");
    } catch (error) {
      message.error("Error creating item: " + error.message);
    }
  };

  const updateItem = (id, updatedData) => {
    try {
      dispatch(updateData({ entity, id, updatedData }));
      message.success("Item updated successfully!");
    } catch (error) {
      message.error("Error updating item: " + error.message);
    }
  };

  const deleteItem = (id) => {
    try {
      dispatch(deleteData({ entity, id }));
      message.success("Item deleted successfully!");
    } catch (error) {
      message.error("Error deleting item: " + error.message);
    }
  };

  const setCurrentData = (currentData) => {
    dispatch(setCurrentDataSet({ entity, currentData }));
  };

  const setModal = (show) => {
    dispatch(setShow({ entity, show }));
  };
  const setData = (data) => {
    dispatch(setarrayData({ entity, data }));
  };

  return {
    data,
    currentData,
    show,
    loading,
    error,
    refetch,
    createItem,
    updateItem,
    deleteItem,
    setCurrentData,
    setModal,
    setData,
  };
}

 
