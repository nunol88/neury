import React from 'react';
import ScheduleView from '@/components/ScheduleView';
import AiAssistant from '@/components/AiAssistant';

const AdminAgendamentos = () => {
  return (
    <>
      <ScheduleView isAdmin={true} />
      <AiAssistant />
    </>
  );
};

export default AdminAgendamentos;
