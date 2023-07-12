/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import BillsUI from '../views/BillsUI.js';
import Bills from '../containers/Bills.js';
import { bills } from '../fixtures/bills.js';
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
    window.onNavigate(ROUTES_PATH.Bills);
};

describe('Given I am connected as an employee', () => {
    describe('When I am on Bills Page', () => {
        test('Then bill icon in vertical layout should be highlighted', async () => {
            before();
            await waitFor(() => screen.getByTestId('icon-window'));
            const windowIcon = screen.getByTestId('icon-window');
            expect(windowIcon.classList.contains('active-icon')).toBeTruthy();
        });

        test('Then bills should be ordered from earliest to latest', () => {
            document.body.innerHTML = BillsUI({ data: bills });
            const dates = screen
                .getAllByText(
                    /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12]\d|3[01])$/i
                )
                .map((a) => a.innerHTML);
            const antiChrono = (a, b) => (a < b ? 1 : -1);
            const datesSorted = [...dates].sort(antiChrono);
            expect(dates).toEqual(datesSorted);
        });

        describe('When I click on the eye icon', () => {
            test('Then modal should be opened', () => {
                before();

                const handleClickIconEye = jest.fn(Bills.handleClickIconEye);
                const eyes = screen.getAllByTestId('icon-eye');
                const eye = eyes[0];

                eye.addEventListener('click', handleClickIconEye);
                userEvent.click(eye);
                expect(handleClickIconEye).toHaveBeenCalled();

                const modal = screen.getByText('Justificatif');
                expect(modal).toBeTruthy();
            });
        });

        describe('When I click on the new bill button', () => {
            test('Then I should be redirected to newBill page', async () => {
                before();

                const newBillButton = screen.getByTestId('btn-new-bill');
                userEvent.click(newBillButton);
                await waitFor(() => screen.getByTestId('form-new-bill'));
                const form = screen.getByTestId('form-new-bill');
                expect(form).toBeTruthy;
            });
        });

        // test d'intégration GET
        test('fetches bills from mock API GET', async () => {
            before();

            await waitFor(() => screen.getByTestId('tbody'));
            expect(screen.getByTestId('tbody')).toBeDefined();
        });

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
                        email: 'a@a',
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
    });
});
