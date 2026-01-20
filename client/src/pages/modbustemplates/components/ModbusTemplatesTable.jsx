 
import ReusableTable from '../../../components/ui/reusableTable';
import useTemplate from '../../../lib/hooks/useTemplate';

const ModbusTemplatesTable = ({
  onView,
  onEdit,
  onDelete
}) => {
  const { templates, mode, currentPage, totalPages, onPageChange } = useTemplate();
  if (!templates || templates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">No templates available</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <ReusableTable
        data={templates}
        columns={[
 
          { key: "name", label: "Name", align: "left", textWrap: 'nowrap' },
          { key: "driveCode", label: "Drive Code", align: "left", textWrap: 'nowrap' },
          
        ]}
        headerColor="bg-gray-700"
        headerTextColor="text-white"
        bordered
        onEdit={(page) => onEdit(page)}
        onView={(page) => onView(page)}
        onDelete={(page) => onDelete(page)}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => onPageChange(page)}
      />
    </div>
  );
}

export default ModbusTemplatesTable;
