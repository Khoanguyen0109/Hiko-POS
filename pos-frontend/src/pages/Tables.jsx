import { useState, useEffect } from "react";
import BackButton from "../components/shared/BackButton";
import TableCard from "../components/tables/TableCard";
import { enqueueSnackbar } from "notistack";
import { useSelector, useDispatch } from "react-redux";
import { fetchTables } from "../redux/slices/tableSlice";

const Tables = () => {
  const dispatch = useDispatch();
  const {
    items: tables,
    loading,
    error,
  } = useSelector((state) => state.tables);
  const [status, setStatus] = useState("all");

  useEffect(() => {
    document.title = "POS | Tables";
    dispatch(fetchTables());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
    }
  }, [error]);

  return (
    <section className="bg-[#1f1f1f] pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-xl sm:text-2xl font-bold tracking-wider">
            Tables
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setStatus("all")}
            className={`text-[#ababab] text-sm sm:text-lg ${
              status === "all" && "bg-[#383838] rounded-lg px-3 sm:px-5 py-2"
            } rounded-lg px-3 sm:px-5 py-2 font-semibold`}
          >
            All
          </button>
          <button
            onClick={() => setStatus("booked")}
            className={`text-[#ababab] text-sm sm:text-lg ${
              status === "booked" && "bg-[#383838] rounded-lg px-3 sm:px-5 py-2"
            } rounded-lg px-3 sm:px-5 py-2 font-semibold`}
          >
            Booked
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 px-4 sm:px-16 py-4 h-[calc(100vh-200px)] sm:h-[650px] overflow-y-scroll scrollbar-hide">
        {loading ? (
          <div className="col-span-full flex justify-center items-center">
            <div className="text-[#ababab]">Loading tables...</div>
          </div>
        ) : (
          tables?.map((table) => {
            return (
              <TableCard
                key={table._id}
                id={table._id}
                name={table.tableNo}
                status={table.status}
                initials={table?.currentOrder?.customerDetails?.name}
                seats={table.seats}
              />
            );
          })
        )}
      </div>
    </section>
  );
};

export default Tables;
