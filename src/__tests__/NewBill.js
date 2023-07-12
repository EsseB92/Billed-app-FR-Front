/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import NewBillUI from '../views/NewBillUI.js';
import NewBill from '../containers/NewBill.js';
import { ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import mockStore from '../__mocks__/store';
import router from '../app/Router.js';

jest.mock('../app/store', () => mockStore);

const before = () => {
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
    router();
    window.onNavigate(ROUTES_PATH.NewBill);
};

describe('Given I am connected as an employee', () => {
    describe('When I am on new bill Page', () => {
        test('Then mail icon in vertical layout should be highlighted', async () => {
            before();

            await waitFor(() => screen.getByTestId('icon-mail'));
            const mailIcon = screen.getByTestId('icon-mail');
            expect(mailIcon.classList.contains('active-icon')).toBeTruthy();
        });

        describe('When user upload a file', () => {
            describe('When the file is an image (jpeg, jpg, png, gif)', () => {
                test('Then it should be uploaded', () => {
                    before();

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
                    before();

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
                    before();

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

                    // await waitFor(() => screen.getByText('Mes notes de frais'));
                    // const btnBillPage = screen.getByText('Mes notes de frais');
                    // expect(btnBillPage).toBeTruthy;
                });
            });
        });

        // test d'intégration POST
        test('fill form from mock API GET', async () => {
            jest.spyOn(mockStore, 'bills');
            const newBill = new NewBill({
                document,
                onNavigate,
                store: mockStore,
                localStorage: window.localStorage,
            });
            const handleSubmit = jest.fn(newBill.handleSubmit);
            const form = screen.getByTestId('form-new-bill');
            form.addEventListener('submit', handleSubmit);
            fireEvent.submit(form);

            expect(mockStore.bills).toHaveBeenCalled();
        });

        describe('When an error occurs on API', () => {
            beforeEach(() => {
                jest.spyOn(mockStore, 'bills');
                jest.spyOn(console, 'error').mockImplementation(() => {});
                Object.defineProperty(window, 'localStorage', {
                    value: localStorageMock,
                });
                Object.defineProperty(window, 'location', {
                    value: { hash: ROUTES_PATH['NewBill'] },
                });
                window.localStorage.setItem(
                    'user',
                    JSON.stringify({
                        type: 'Employee',
                    })
                );
                const root = document.createElement('div');
                root.setAttribute('id', 'root');
                document.body.appendChild(root);
                router();
            });

            test('fetches bills from an API and fails with 404 message error', async () => {
                document.body.innerHTML = BillsUI({ error: 'Erreur 404' });
                window.onNavigate(ROUTES_PATH.Bills);
                await new Promise(process.nextTick);
                const message = screen.getByText(/Erreur 404/);
                expect(message).toBeTruthy();
            });

            test('fetches messages from an API and fails with 500 message error', async () => {
                document.body.innerHTML = BillsUI({ error: 'Erreur 500' });
                window.onNavigate(ROUTES_PATH.Bills);
                await new Promise(process.nextTick);
                const message = screen.getByText(/Erreur 500/);
                expect(message).toBeTruthy();
            });
        });

        // describe('When user upload a file', () => {
        //     describe('When the file is an image (jpeg, jpg, png, gif)', () => {
        //         test('Then it shoul be uploaded', () => {
        //             document.body.innerHTML = NewBillUI();

        //             const onNavigate = (pathname) => {
        //                 document.body.innerHTML = ROUTES({ pathname });
        //             };

        //             const mockBill = new NewBill({
        //                 document,
        //                 onNavigate,
        //                 store: mockStore,
        //                 localStorage: window.localStorage,
        //             });

        //             const handleChangeFile = jest.fn((e) =>
        //                 mockBill.handleChangeFile(e)
        //             );

        //             const fileBtn = screen.getByTestId('file');
        //             fileBtn.addEventListener('change', handleChangeFile);

        //             const file = new File(['file'], 'file.jpg', {
        //                 type: 'image/jpg',
        //             });
        //             fireEvent.change(fileBtn, {
        //                 target: {
        //                     files: [file],
        //                 },
        //             });
        //             expect(handleChangeFile).toHaveBeenCalled();
        //             expect(handleChangeFile).toBeTruthy();
        //             expect(fileBtn.files[0]).toBe(file);
        //             expect(fileBtn.files).toHaveLength(1);
        //         });
        //     });
        // });
    });
});
