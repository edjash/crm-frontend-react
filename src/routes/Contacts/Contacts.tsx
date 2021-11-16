import { useState, useEffect } from 'react';
import apiClient from '../../common/apiClient';
import ContactsGrid, { ContactsGridProps } from './Contacts.Grid';
import { GridRowId } from '@material-ui/data-grid';
import TopBar from '../../common/TopBar';
import Paper from '@material-ui/core/Paper';
import ConfirmDialog from '../../common/ConfirmDialog';
import { useModal } from 'mui-modal-provider';
import { red } from '@material-ui/core/colors';

export default function Contacts() {

  const { showModal } = useModal();

  const [gridState, setGridState] = useState<ContactsGridProps>({
    searchQuery: '',
    searchChanged: false,
    rows: [],
    loading: true,
    init: true,
    page: 1,
    rowCount: 10,
    pageSize: 10,
    pageCount: 10,
  });

  const onDelete = (rowIds: GridRowId[]) => {

    const dialogContent: JSX.Element[] = [];
    const dialogData: GridRowId[] = [];

    for (const row of gridState.rows) {
      if (rowIds.indexOf(row.id) > -1) {
        dialogData.push(row.id);
        dialogContent.push(<span key={row.id}>
          <br />
          {row.fullname}
        </span>);
      }
    }

    const confirm = showModal(ConfirmDialog, {
      title: 'Confirm Delete',
      content: dialogContent,
      onCancel: () => {
        confirm.hide();
      },
      onConfirm: () => {
        confirm.hide();
        handleDelete(dialogData);
      },
    });
  };

  const handleDelete = (rowIds: GridRowId[]) => {
    setGridState({ ...gridState, loading: true });

    apiClient
      .delete('/contacts/' + rowIds.join(','))
      .then((res) => {
        loadContacts(gridState.page);
      }).catch((error) => {
        console.log('Delete error!', error);
      });
  };

  const loadContacts = (page: number) => {
    apiClient
      .get('/contacts', {
        sortBy: 'id',
        sortDirection: 'desc',
        limit: gridState.pageSize,
        search: gridState.searchQuery,
        page: page,
      })
      .then((res) => {
        if (res.data.last_page < res.data.current_page) {
          return loadContacts(res.data.last_page);
        }

        setGridState({
          ...gridState,
          page: res.data.current_page,
          rowCount: res.data.total,
          rows: res.data.data,
          pageCount: Math.ceil(res.data.total / gridState.pageSize),
          loading: false,
          init: false,
          searchChanged: false,
        });
      })
      .catch((error) => {
        if (error) {
          error = 4;
        }
        setGridState({ ...gridState, loading: false });
      });
  };

  const onSearch = (query: string) => {
    setGridState({
      ...gridState,
      searchQuery: query,
      searchChanged: true,
      page: 1,
      loading: true,
    });
  };

  const onPageChange = (event: object, newPage: number) => {
    if (newPage != gridState.page) {
      setGridState({
        ...gridState,
        page: newPage,
        loading: true,
      });
    }
  };

  useEffect(() => {
    if (gridState.loading) {
      const delay = gridState.init ? 1000 : 0;
      const timer = setTimeout(() => {
        loadContacts(gridState.page);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [gridState.page]);

  return (
    <Paper>
      <TopBar />
      <ContactsGrid
        {...gridState}
        onSearch={onSearch}
        onPageChange={onPageChange}
        onDelete={onDelete}
      />
    </Paper>
  );
}
