"""customer logins, homes and bids per customer

Revision ID: b3d5f7a9c1e2
Revises: a7c1d9e3b5f2
Create Date: 2026-10-18 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'b3d5f7a9c1e2'
down_revision: Union[str, Sequence[str], None] = 'a7c1d9e3b5f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('customers') as b:
        b.add_column(sa.Column('password_hash', sa.Text(), nullable=True))
        b.add_column(sa.Column('token_hash', sa.Text(), nullable=True))
        b.create_unique_constraint('uq_customers_token_hash', ['token_hash'])
    with op.batch_alter_table('homes') as b:
        b.add_column(sa.Column('customer_id', sa.Text(), nullable=True))
        b.create_foreign_key('fk_homes_customer', 'customers', ['customer_id'], ['customer_id'])
    with op.batch_alter_table('bids') as b:
        b.add_column(sa.Column('customer_id', sa.Text(), nullable=True))
        b.create_foreign_key('fk_bids_customer', 'customers', ['customer_id'], ['customer_id'])
    # The demo customer owns the existing demo home and bids.
    op.execute("UPDATE homes SET customer_id = 'cust_01' WHERE home_id = 'home_01' AND EXISTS "
               "(SELECT 1 FROM customers WHERE customer_id = 'cust_01')")
    op.execute("UPDATE bids SET customer_id = 'cust_01' WHERE bid_id NOT LIKE 'home\\_%' ESCAPE '\\' AND EXISTS (SELECT 1 FROM customers WHERE customer_id = 'cust_01')")


def downgrade() -> None:
    with op.batch_alter_table('bids') as b:
        b.drop_constraint('fk_bids_customer', type_='foreignkey')
        b.drop_column('customer_id')
    with op.batch_alter_table('homes') as b:
        b.drop_constraint('fk_homes_customer', type_='foreignkey')
        b.drop_column('customer_id')
    with op.batch_alter_table('customers') as b:
        b.drop_constraint('uq_customers_token_hash', type_='unique')
        b.drop_column('token_hash')
        b.drop_column('password_hash')
