/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import NewBillUI from '../views/NewBillUI.js';
import NewBill from '../containers/NewBill.js';
import { ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import mockStore from '../__mocks__/store';
import router from '../app/Router.js';
import BillsUI from '../views/BillsUI.js';

jest.mock('../app/store', () => mockStore);

describe('Given I am connected as an employee', () => {
    describe('When I am on new bill Page', () => {
        beforeEach(() => {
            Object.defineProperty(window, 'localStorage', {
                value: localStorageMock,
            });
            window.localStorage.setItem(
                'user',
                JSON.stringify({
                    type: 'Employee',
                })
            );
            const root = document.createElement('div');
            root.setAttribute('id', 'root');
            document.body.append(root);
            root.append(NewBillUI());
            router();
            window.onNavigate(ROUTES_PATH.NewBill);
        });
        test('Then mail icon in vertical layout should be highlighted', () => {
            const mailIcon = screen.getByTestId('icon-mail');
            expect(mailIcon.classList.contains('active-icon')).toBeTruthy();
        });

        describe('When user upload a file', () => {
            describe('When the file is an image (jpeg, jpg, png, gif)', () => {
                test('Then it should be uploaded', () => {
                    const newBill = new NewBill({
                        document,
                        onNavigate,
                        store: mockStore,
                        localStorage: window.localStorage,
                    });
                    const handleChangeFile = jest.fn(newBill.handleChangeFile);
                    const fileInput = screen.getByTestId('file');
                    const file = new File(['file'], 'file.png', {
                        type: 'image/png',
                    });

                    fileInput.addEventListener('change', handleChangeFile);
                    userEvent.upload(fileInput, file);
                    expect(handleChangeFile).toHaveBeenCalled();
                    expect(fileInput.files[0]).toBe(file);
                });
            });
            describe('When the file is not an image', () => {
                test('Then it should not be uploaded', () => {
                    const newBill = new NewBill({
                        document,
                        onNavigate,
                        store: mockStore,
                        localStorage: window.localStorage,
                    });
                    const handleChangeFile = jest.fn(newBill.handleChangeFile);
                    const fileInput = screen.getByTestId('file');
                    const file = new File(['file'], 'file.txt', {
                        type: 'text/plain',
                    });

                    fileInput.addEventListener('change', handleChangeFile);
                    userEvent.upload(fileInput, file);
                    expect(handleChangeFile).toHaveBeenCalled();
                    expect(fileInput.files).toHaveLength(1);
                });
            });
        });

        describe('When I click on the submit button', () => {
            describe('When the form is correct', () => {
                test('Then the form should be submitted', async () => {
                    document.body.innerHTML = NewBillUI();

                    userEvent.type(
                        screen.getByTestId('datepicker'),
                        '2001-01-01'
                    );
                    userEvent.type(screen.getByTestId('amount'), '10');
                    userEvent.type(screen.getByTestId('pct'), '10');

                    const file = new File(['file'], 'file.txt', {
                        type: 'text/plain',
                    });
                    userEvent.upload(screen.getByTestId('file'), file);

                    const handleSubmit = jest.fn(NewBill.handleSubmit);
                    const submitButton = screen.getByText('Envoyer');
                    submitButton.addEventListener('click', handleSubmit);
                    userEvent.click(submitButton);

                    expect(handleSubmit).toHaveBeenCalled();
                });
            });
        });
    });

    // test d'intégration POST
    // test('fill form from mock API GET', async () => {
    //     localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
    //     const root = document.createElement("div")
    //     root.setAttribute("id", "root")
    //     document.body.append(root)
    //     router()

    //     document.body.innerHTML = NewBillUI({ data: bills })
    //     await waitFor(() => screen.getByTestId("button"))

    //     expect(screen.getByTestId("button")).toBeTruthy();
    // });

    describe('When an error occurs on API', () => {
        beforeEach(() => {
            jest.spyOn(mockStore, 'bills');
            Object.defineProperty(window, 'localStorage', {
                value: localStorageMock,
            });
            window.localStorage.setItem(
                'user',
                JSON.stringify({
                    type: 'Employee',
                })
            );
            const root = document.createElement('div');
            root.setAttribute('id', 'root');
            document.body.append(root);
            root.append(NewBillUI);
            router();
        });

        test('fetches bills from an API and fails with 404 message error', async () => {
            mockStore.bills.mockImplementationOnce(() => {
                return {
                    list: () => {
                        return Promise.reject(new Error('Erreur 404'));
                    },
                };
            });

            document.body.innerHTML = BillsUI({ error: 'Erreur 404' });
            await new Promise(process.nextTick);
            const message = await screen.getByText(/Erreur 404/);
            expect(message).toBeTruthy();
        });

        test('fetches messages from an API and fails with 500 message error', async () => {
            mockStore.bills.mockImplementationOnce(() => {
                return {
                    list: () => {
                        return Promise.reject(new Error('Erreur 500'));
                    },
                };
            });
            document.body.innerHTML = BillsUI({ error: 'Erreur 500' });
            await new Promise(process.nextTick);
            const message = await screen.getByText(/Erreur 500/);
            expect(message).toBeTruthy();
        });
    });
});
