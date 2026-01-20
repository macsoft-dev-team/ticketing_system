import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogTrigger } from '../../components/ui/dialog';
import Header from './components/header';
import ModbusTemplateModal from './components/ModbusTemplateModal';
import ConfirmDeleteDialog from './components/ConfirmDeleteDialog';
import ModbusTemplatesTable from './components/ModbusTemplatesTable';
import useTemplate from '../../lib/hooks/useTemplate';
import { useEffect } from 'react';
import  useOrganisation  from '../../lib/hooks/useOrganisation';
import useUser from '../../lib/hooks/useUser';
 

const ModbusTemplates = () => {
  const {
    templates,
    template,
    mode,
    filter,
    currentPage,
    totalPages,
    onPageChange,
    setMode,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setTemplate,
    getTemplates,
    loading,
    error
  } = useTemplate();
  const { users, fetchUsers } = useUser();
  const { organisations, fetchOrganisations } = useOrganisation();
  const handleModeChange = (newMode, templateData = null) => {
    setMode(newMode);
    if (templateData !== undefined) {
      setTemplate(templateData);
    }
  };

  useEffect(() => {
    fetchOrganisations({ skip: null, take: null });
    fetchUsers({ skip: null, take: null });
  }, []);

  const handleDeleteTemplate = (id) => {
    deleteTemplate(id)
      .then(() => {
        handleModeChange(null, null);
      })
      .catch(() => {
        // Keep confirmation dialog open on error
      });
  };

  const openConfirmDelete = (templateToDelete) => {
    handleModeChange('confirmDelete', templateToDelete);
  };

  const confirmDelete = () => {
    if (template) {
      handleDeleteTemplate(template.id);
    }
    handleModeChange(null);
  };

  const handleOpenEdit = (editTemplate) => {
    handleModeChange('edit', { ...editTemplate });
  };

  const handleOpenView = (viewTemplate) => {
    handleModeChange('view', viewTemplate);
  };

  const handleSave = (data) => {
    if (template && template.id) {
      return updateTemplate(template.id, data)
        .then(() => {
          handleModeChange(null);
        })
        .catch(() => {
          throw new Error();
        });
    } else {
      return createTemplate(data)
        .then(() => {
          handleModeChange(null);
        })
        .catch(() => {
          throw new Error();
        });
    }
  };

  useEffect(() => {
    getTemplates({ skip: currentPage, take: 10, filter: filter });
  }, [currentPage, filter]);

  return (
    <motion.div
      className="space-y-6 p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Header
        onAddTemplate={() => handleModeChange('create', { name: '', driveCode: '', parameters: [] })}
        onSearchChange={filter => getTemplates({ skip: 0, take: 10, filter })}
        totalCount={templates?.length || 0}
      />

      <Dialog open={mode?.create || false} onOpenChange={open => handleModeChange(open ? 'create' : null)}>
        <ModbusTemplateModal
          open={mode?.create || false}
          onOpenChange={open => handleModeChange(open ? 'create' : null)}
          mode="create"
          template={template || { name: '', driveCode: '', parameters: [] }}
          onSave={handleSave}
          disableSave={false}
          customers={organisations || []}
          users={users || []}
        />
      </Dialog>

      <ModbusTemplateModal
        open={mode?.edit || false}
        onOpenChange={open => handleModeChange(open ? 'edit' : null)}
        mode="edit"
        template={template || { name: '', driveCode: '', parameters: [] }}
        users={users || []}
        onSave={handleSave}
        disableSave={false}
        customers={organisations || []}
      />

      <ModbusTemplateModal
        open={mode?.view || false}
        onOpenChange={open => handleModeChange(open ? 'view' : null)}
        mode="view"
        template={template || { name: '', driveCode: '', parameters: [] }}
        users={users || []}
        customers={organisations || []}
      />

      <ModbusTemplatesTable
        onView={handleOpenView}
        onEdit={handleOpenEdit}
        onDelete={openConfirmDelete}
      />

      <ConfirmDeleteDialog
        open={mode?.confirmDelete || false}
        onOpenChange={open => handleModeChange(open ? 'confirmDelete' : null)}
        templateToDelete={template}
        onConfirm={confirmDelete}
      />
    </motion.div>
  );
};

export default ModbusTemplates;
