import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
  } from "typeorm";
import { Roles } from "./roles";
  
  @Entity({ name: "ChildRoles" })
  export class ChildRoles {
  
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => Roles, dep => dep.ChildRolesFK)
    @JoinColumn({name: "RoleId"})
    RoleId!: Roles;

    @Column({type: 'nvarchar', default: null, length: 100})
    ChildId!: string

    @CreateDateColumn()
    CreatedDate!: Date;
  
    @UpdateDateColumn()
    UpdatedDate!: Date;
  };
  