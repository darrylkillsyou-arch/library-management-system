"""Initial 3NF library schema

Revision ID: 3d6636c9b39d
Revises: 
Create Date: 2026-11-03 18:00:55.821110

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '3d6636c9b39d'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Authors
    op.create_table(
        'authors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_authors_id'), 'authors', ['id'], unique=False)

    # 2. Categories
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)

    # 3. Books
    op.create_table(
        'books',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('isbn', sa.String(length=20), nullable=False),
        sa.Column('title', sa.String(length=300), nullable=False),
        sa.Column('author_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('publisher', sa.String(length=200), nullable=True),
        sa.Column('publication_year', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('cover_url', sa.String(length=500), nullable=True),
        sa.Column('is_archived', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint('publication_year >= 1000 AND publication_year <= 2100', name='chk_pub_year'),
        sa.ForeignKeyConstraint(['author_id'], ['authors.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_books_id'), 'books', ['id'], unique=False)
    op.create_index(op.f('ix_books_isbn'), 'books', ['isbn'], unique=True)
    op.create_index(op.f('ix_books_title'), 'books', ['title'], unique=False)

    # 4. Book Copies
    op.create_table(
        'book_copies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('book_id', sa.Integer(), nullable=False),
        sa.Column('accession_number', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='Available'),
        sa.Column('shelf_location', sa.String(length=100), nullable=True),
        sa.CheckConstraint("status IN ('Available', 'Issued', 'Maintenance', 'Lost')", name='chk_copy_status'),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_book_copies_id'), 'book_copies', ['id'], unique=False)
    op.create_index(op.f('ix_book_copies_accession_number'), 'book_copies', ['accession_number'], unique=True)

    # 5. Members
    op.create_table(
        'members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(length=200), nullable=False),
        sa.Column('roll_number', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=200), nullable=False),
        sa.Column('password_hash', sa.String(length=256), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='student'),
        sa.Column('department', sa.String(length=100), nullable=True),
        sa.Column('programme', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('joined_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("role IN ('student', 'admin')", name='chk_member_role'),
        sa.CheckConstraint("status IN ('active', 'inactive', 'suspended')", name='chk_member_status'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_members_id'), 'members', ['id'], unique=False)
    op.create_index(op.f('ix_members_email'), 'members', ['email'], unique=True)
    op.create_index(op.f('ix_members_roll_number'), 'members', ['roll_number'], unique=True)

    # 6. Loans
    op.create_table(
        'loans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('copy_id', sa.Integer(), nullable=False),
        sa.Column('member_id', sa.Integer(), nullable=False),
        sa.Column('issued_on', sa.DateTime(), nullable=False),
        sa.Column('due_on', sa.DateTime(), nullable=False),
        sa.Column('returned_on', sa.DateTime(), nullable=True),
        sa.Column('issued_by', sa.Integer(), nullable=False),
        sa.Column('returned_to', sa.Integer(), nullable=True),
        sa.CheckConstraint('due_on >= issued_on', name='chk_due_after_issued'),
        sa.ForeignKeyConstraint(['copy_id'], ['book_copies.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['member_id'], ['members.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['issued_by'], ['members.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['returned_to'], ['members.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_loans_id'), 'loans', ['id'], unique=False)
    op.create_index(op.f('ix_loans_copy_id'), 'loans', ['copy_id'], unique=False)
    op.create_index(op.f('ix_loans_member_id'), 'loans', ['member_id'], unique=False)

    # 7. Audit Logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=True),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        sa.Column('performed_by', sa.Integer(), nullable=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['performed_by'], ['members.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('loans')
    op.drop_table('members')
    op.drop_table('book_copies')
    op.drop_table('books')
    op.drop_table('categories')
    op.drop_table('authors')
